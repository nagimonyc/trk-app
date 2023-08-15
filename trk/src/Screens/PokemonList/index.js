import * as React from 'react';
import { ScrollView } from 'react-native';
import { List } from 'react-native-paper';
import ClimbImage from '../../Components/PokemonImage'; // Change to a suitable component for climbs
import { ClimbList } from '../../PokemonData'; // Change to the source for climb data

function PokemonListScreen(props) {
  const { navigation } = props;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      {ClimbList.map(c => {
        return (
          <List.Item
            key={c.name}
            title={c.name}
            description={c.description}
            left={() => <ClimbImage name={c.name} />} // Change to a suitable component for climbs
            onPress={() => {
              navigation.navigate('Detail', { climb: c, allowCreate: true });
            }}
          />
        );
      })}
    </ScrollView>
  );
}

export default PokemonListScreen;